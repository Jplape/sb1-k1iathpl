import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import {
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../types/supabase';
type AuthLog = Tables<'auth_logs'>;
type ModAction = Tables<'moderation_actions'>;

interface AdminStats {
  revenue: {
    total: number;
    premium: number;
    subscriptions: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    suspended: number;
    growth: number;
  };
  content: {
    pending: number;
    flagged: number;
    removed: number;
  };
  fraud: {
    riskScore: number;
    flaggedUsers: number;
    suspiciousActivity: number;
  };
  auth: {
    totalAttempts: number;
    failedAttempts: number;
    suspiciousAttempts: number;
  };
}

const columnHelper = createColumnHelper<ModAction>();
const authLogColumnHelper = createColumnHelper<AuthLog>();

const authLogColumns = [
  authLogColumnHelper.accessor('timestamp', {
    header: 'Date',
    cell: (info) => {
      const value = info.getValue();
      return value && typeof value === 'string' && !isNaN(new Date(value).getTime())
        ? format(new Date(value), 'dd/MM/yyyy HH:mm')
        : '-';
    },
  }),
  authLogColumnHelper.accessor('email', {
    id: 'email',
    header: 'Email',
  }),
  authLogColumnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <span className={`capitalize ${
        info.getValue() === 'success' ? 'text-green-600' :
        info.getValue() === 'failed' ? 'text-red-600' :
        'text-blue-600'
      }`}>
        {info.getValue() || 'attempt'}
      </span>
    ),
  }),
  authLogColumnHelper.accessor('error_type', {
    id: 'error_type',
    header: 'Error Type',
  }),
  authLogColumnHelper.accessor('email_confirmed', {
    id: 'email_confirmed',
    header: 'Email Confirmed',
    cell: (info) => (
      info.getValue() ?
        <CheckCircle className="w-5 h-5 text-green-500" /> :
        <XCircle className="w-5 h-5 text-red-500" />
    ),
  }),
  authLogColumnHelper.accessor('attempt_count', {
    id: 'attempt_count',
    header: 'Attempts',
  }),
];

const columns = [
  columnHelper.accessor('created_at', {
    header: 'Date',
    cell: (info) => {
      const value = info.getValue();
      return value && !isNaN(new Date(value).getTime())
        ? format(new Date(value), 'dd/MM/yyyy HH:mm')
        : '-';
    },
  }),
  columnHelper.accessor('type', {
    header: 'Action',
    cell: (info) => (
      <span className={`capitalize ${
        info.getValue() === 'approval' ? 'text-green-600' :
        info.getValue() === 'rejection' ? 'text-red-600' :
        'text-yellow-600'
      }`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('risk_score', {
    header: 'Risk Score',
    cell: (info) => (
      <div className="flex items-center">
        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
          <div
            className={`h-2 rounded-full ${
              (info.getValue() || 0) > 75 ? 'bg-red-500' :
              (info.getValue() || 0) > 50 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${info.getValue() || 0}%` }}
          />
        </div>
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('reason', {
    header: 'Reason',
    cell: (info) => info.getValue() || '-',
  }),
];

export function AdminDashboard() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [authLogSorting, setAuthLogSorting] = useState<SortingState>([]);
  const [filterValue, setFilterValue] = useState('');
  const [actionType, setActionType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'moderation'|'auth'>('moderation');

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      return data as AdminStats;
    },
  });

  const { data: authLogs = [], isLoading: loadingAuthLogs } = useQuery({
    queryKey: ['auth-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const { data: authStats } = useQuery({
    queryKey: ['auth-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analyze-auth-logs');
      if (error) throw error;
      return data;
    },
  });

  const { data: actions = [], isLoading: loadingActions } = useQuery({
    queryKey: ['moderation-actions', actionType, filterValue],
    queryFn: async () => {
      let query = supabase
        .from('moderation_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (actionType !== 'all') {
        query = query.eq('type', actionType);
      }

      if (filterValue) {
        query = query.or(`reason.ilike.%${filterValue}%,target_id.eq.${filterValue}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const authLogTable = useReactTable({
    data: authLogs,
    columns: authLogColumns,
    state: { sorting: authLogSorting },
    onSortingChange: setAuthLogSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const table = useReactTable({
    data: actions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const handleBulkAction = async (action: 'approve' | 'reject', ids: string[]) => {
    try {
      const { error } = await supabase.rpc('bulk_moderation_action', {
        action_type: action,
        content_ids: ids,
      });

      if (error) throw error;
      toast.success(`Bulk ${action} successful`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleExport = async (type: 'csv' | 'json') => {
    try {
      const { data, error } = await supabase
        .from('moderation_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (type === 'csv') {
        const headers = ['Date', 'Action', 'Risk Score', 'Reason', 'Admin'];
        const csvContent = [
          headers.join(','),
          ...data.map(row => [
            format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss'),
            row.type,
            row.risk_score,
            `"${row.reason.replace(/"/g, '""')}"`,
            row.admin_id,
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moderation-actions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
      } else {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moderation-actions-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
      }

      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  if (loadingStats || loadingActions || loadingAuthLogs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'moderation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('moderation')}
        >
          Moderation
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'auth' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('auth')}
        >
          Authentication Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Revenue (30j)</p>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{stats?.revenue?.total?.toFixed(2) || '0.00'}€</p>
          <p className={`text-sm ${(stats?.revenue?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(stats?.revenue?.growth || 0) > 0 ? '+' : ''}{stats?.revenue?.growth || 0}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Active Users</p>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{stats?.users?.active || 0}</p>
          <p className="text-sm text-gray-500">sur {stats?.users?.total || 0} total</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending Reviews</p>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{stats?.content?.pending || 0}</p>
          <p className="text-sm text-yellow-600">
            {stats?.content?.flagged || 0} flagged
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Risk Score</p>
            <AlertTriangle className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{stats?.fraud?.riskScore || 0}/100</p>
          <p className="text-sm text-red-600">
            {stats?.fraud?.flaggedUsers || 0} suspicious users
          </p>
        </div>
      </div>

      {activeTab === 'moderation' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-600"
              >
                <option value="all">All Actions</option>
                <option value="approval">Approvals</option>
                <option value="rejection">Rejections</option>
                <option value="ban">Bans</option>
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                onClick={() => handleBulkAction('approve', table.getSelectedRowModel().rows.map(row => row.original.id))}
                disabled={table.getSelectedRowModel().rows.length === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('reject', table.getSelectedRowModel().rows.map(row => row.original.id))}
                disabled={table.getSelectedRowModel().rows.length === 0}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Authentication Logs</h3>
              {authStats && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Failed Attempts</p>
                    <p className="text-xl font-semibold text-red-600">
                      {authStats.failedAttempts}/{authStats.totalAttempts}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Suspicious Patterns</p>
                    <p className="text-xl font-semibold text-yellow-600">
                      {authStats.bruteForcePatterns.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                {authLogTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() && (
                            header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {authLogTable.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}