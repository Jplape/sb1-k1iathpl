// Système avancé de monitoring des logs d'authentification
import { SupabaseClient } from '@supabase/supabase-js'

interface AuthLog {
  id: number
  email: string
  status: 'attempt'|'success'|'failed'
  ip_address?: string
  error_type?: string
  timestamp: string
  user_agent?: string
  country_code?: string
}

interface AlertThreshold {
  failedAttempts: number
  timeWindow: number // en minutes
  ipAttempts: number
  emailAttempts: number
}

interface Alert {
  type: 'suspicious_ip' | 'suspicious_email' | 'brute_force'
  message: string
  count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip?: string
  email?: string
}

interface AnalysisResult {
  stats: {
    totalAttempts: number
    failedAttempts: number
    successRate: number
    uniqueIPs: number
    countries: number
    devices: number
  }
  alerts: Alert[]
  timeWindow: {
    start: string
    end: string
  }
}

const DEFAULT_THRESHOLDS: AlertThreshold = {
  failedAttempts: 5,
  timeWindow: 15,
  ipAttempts: 3,
  emailAttempts: 3
}

export async function analyzeAuthLogs(
  supabase: SupabaseClient,
  thresholds = DEFAULT_THRESHOLDS
): Promise<AnalysisResult> {
  // Récupère les logs selon la fenêtre temporelle configurée
  const timeWindow = new Date(Date.now() - thresholds.timeWindow * 60000).toISOString()
  const { data: logs, error } = await supabase
    .from('auth_logs')
    .select('*')
    .gte('timestamp', timeWindow)
    .order('timestamp', { ascending: false })

  if (error) throw error
  if (!logs?.length) return {
    stats: {
      totalAttempts: 0,
      failedAttempts: 0,
      successRate: 0,
      uniqueIPs: 0,
      countries: 0,
      devices: 0
    },
    alerts: [],
    timeWindow: {
      start: timeWindow,
      end: new Date().toISOString()
    }
  }

  // Analyse avancée
  const stats = {
    totalAttempts: logs.length,
    failedAttempts: logs.filter(l => l.status === 'failed').length,
    successRate: logs.filter(l => l.status === 'success').length / logs.length,
    uniqueIPs: new Set(logs.map(l => l.ip_address)).size,
    countries: new Set(logs.map(l => l.country_code)).size,
    devices: new Set(logs.map(l => l.user_agent)).size
  }

  // Détection d'attaques
  const alerts: Alert[] = []

  // 1. Force brute par IP
  const ipAttempts = logs.reduce<Record<string, number>>((acc, log) => {
    if (!log.ip_address) return acc
    acc[log.ip_address] = (acc[log.ip_address] || 0) + 1
    return acc
  }, {})

  // 2. Force brute par email
  const emailAttempts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.email] = (acc[log.email] || 0) + 1
    return acc
  }, {})

  // 3. Patterns suspects
  const suspiciousPatterns = logs
    .filter(log => log.status === 'failed')
    .reduce<Record<string, number>>((acc, log) => {
      const key = `${log.email}_${log.ip_address}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  // Génération des alertes
  for (const [ip, count] of Object.entries(ipAttempts)) {
    if (count >= thresholds.ipAttempts) {
      alerts.push({
        type: 'suspicious_ip',
        message: `Tentatives multiples depuis IP ${ip}`,
        count,
        ip,
        severity: count > 10 ? 'high' : 'medium'
      })
    }
  }

  for (const [email, count] of Object.entries(emailAttempts)) {
    if (count >= thresholds.emailAttempts) {
      alerts.push({
        type: 'suspicious_email',
        message: `Tentatives multiples sur email ${email}`,
        count,
        email,
        severity: count > 5 ? 'high' : 'medium'
      })
    }
  }

  for (const [pattern, count] of Object.entries(suspiciousPatterns)) {
    if (count >= thresholds.failedAttempts) {
      const [email, ip] = pattern.split('_')
      alerts.push({
        type: 'brute_force',
        message: `Pattern de force brute détecté (${count} tentatives)`,
        count,
        email,
        ip,
        severity: 'critical'
      })
    }
  }

  return {
    stats,
    alerts: alerts.sort((a, b) =>
      b.severity.localeCompare(a.severity) || b.count - a.count
    ),
    timeWindow: {
      start: timeWindow,
      end: new Date().toISOString()
    }
  }
}