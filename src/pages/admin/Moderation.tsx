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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

type ContentType = 'product' | 'message' | 'user';

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  content_type: ContentType;
  content_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  reporter: {
    full_name: string | null;
  };
  reported: {
    full_name: string | null;
  };
}

const columnHelper = createColumnHelper<Report>();

export function Moderation() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', statusFilter, typeFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(full_name),
          reported:profiles!reports_reported_id_fkey(full_name)
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('content_type', typeFilter);
      }

      if (searchTerm) {
        query = query.or(`reason.ilike.%${searchTerm}%,reported.full_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const columns = [
    columnHelper.accessor('created_at', {
      header: 'Date',
      cell: (info) => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
    }),
    columnHelper.accessor('content_type', {
      header: 'Type',
      cell: (info) => (
        <span className="capitalize">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('reporter.full_name', {
      header: 'Signalé par',
      cell: (info) => info.getValue() || 'Anonyme',
    }),
    columnHelper.accessor('reported.full_name', {
      header: 'Utilisateur signalé',
      cell: (info) => info.getValue() || 'Anonyme',
    }),
    columnHelper.accessor('reason', {
      header: 'Raison',
      cell: (info) => (
        <div className="max-w-xs truncate" title={info.getValue()}>
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Statut',
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : status === 'resolved'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('id', {
      header: 'Actions',
      cell: (info) => {
        const report = info.row.original;
        const isPending = report.status === 'pending';

        const handleAction = async (action: 'resolve' | 'dismiss') => {
          try {
            const { error } = await supabase
              .from('reports')
              .update({
                status: action === 'resolve' ? 'resolved' : 'dismissed',
                resolved_at: new Date().toISOString(),
              })
              .eq('id', report.id);

            if (error) throw error;
            toast.success(`Signalement ${action === 'resolve' ? 'résolu' : 'rejeté'}`);
          } catch (error) {
            console.error(`Error ${action}ing report:`, error);
            toast.error(`Erreur lors du traitement du signalement`);
          }
        };

        return isPending ? (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleAction('resolve')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction('dismiss')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : null;
      },
    }),
  ];

  const table = useReactTable({
    data: reports,
    columns,
    state: {
      sorting,
    },
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-yellow-600">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="text-2xl font-bold text-gray-900">
            Modération
            {statusFilter === 'pending' && reports.length > 0 && (
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {reports.length} en attente
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="pending">En attente</option>
            <option value="resolved">Résolus</option>
            <option value="dismissed">Rejetés</option>
            <option value="all">Tous</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="all">Tous les types</option>
            <option value="product">Produits</option>
            <option value="message">Messages</option>
            <option value="user">Utilisateurs</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
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
    </div>
  );
}