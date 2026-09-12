import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Search, Loader2 } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: string;
  onRowClick?: (row: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  showAnimations?: boolean;
  rowVariant?: 'default' | 'striped' | 'bordered';
  density?: 'comfortable' | 'compact' | 'spacious';
}

const densityStyles = {
  comfortable: { th: 'px-4 py-3', td: 'px-4 py-3' },
  compact: { th: 'px-3 py-2', td: 'px-3 py-2' },
  spacious: { th: 'px-6 py-4', td: 'px-6 py-4' },
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  searchable = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  loading = false,
  className = '',
  showAnimations = true,
  rowVariant = 'default',
  density = 'comfortable',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!searchable) return data;
    return data.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm, searchable]);

  const handleSort = (key: string) => {
    if (onSort && columns.find((c) => c.key === key)?.sortable) {
      onSort(key);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const cellPadding = densityStyles[density];

  const skeletonRows = useMemo(() => Array.from({ length: 5 }), []);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${cellPadding.th} ${alignStyles[column.align || 'left']} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}
                >
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {skeletonRows.map((_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className={`${cellPadding.td} ${alignStyles[column.align || 'left']}`}>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    );
  }

  const rowVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10, height: 0 },
    hover: { backgroundColor: 'var(--row-hover-bg, #f3f4f6)', x: 4 },
  };

  const darkHoverBg = '#1f2937';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`overflow-x-auto ${className}`}>
      {searchable && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <motion.input
            whileHover={{ scale: 1.01 }}
            whileFocus={{ scale: 1.01 }}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </motion.div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${cellPadding.th} ${alignStyles[column.align || 'left']} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''} ${column.className || ''}`}
                  onClick={() => handleSort(column.key)}
                  style={{ userSelect: column.sortable ? 'none' : 'auto' }}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence mode="popLayout">
              {filteredData.length === 0 ? (
                <motion.tr
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={columns.length} className={`${cellPadding.td} text-center py-12`}>
                    <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-10 h-10 text-gray-300 dark:text-gray-600 animate-spin" size={40} />
                      <p className="text-lg">{emptyMessage}</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  </td>
                </motion.tr>
              ) : (
                filteredData.map((row, index) => (
                  <motion.tr
                    key={row[keyField]}
                    initial={showAnimations ? { opacity: 0, y: 20 } : false}
                    animate={showAnimations ? { opacity: 1, y: 0 } : { opacity: 1 }}
                    exit={showAnimations ? { opacity: 0, y: -20 } : { opacity: 0 }}
                    transition={{ duration: 0.2, delay: showAnimations ? index * 0.03 : 0, ease: [0.4, 0, 0.2, 1] }}
                    whileHover={onRowClick || rowVariant !== 'default' ? { x: 4 } : undefined}
                    className={`
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${rowVariant === 'striped' && index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}
                      ${rowVariant === 'bordered' ? 'border-b border-gray-100 dark:border-gray-700' : ''}
                      ${hoveredRow === row[keyField] ? `bg-gray-100 dark:bg-gray-700/50` : ''}
                    `}
                    onMouseEnter={() => setHoveredRow(row[keyField])}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <motion.td
                        key={column.key}
                        initial={false}
                        animate={{ opacity: 1 }}
                        className={`${cellPadding.td} ${alignStyles[column.align || 'left']} text-sm text-gray-900 dark:text-white ${column.className || ''}`}
                        whileHover={column.render ? { scale: 1.01 } : undefined}
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </motion.td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-1"
        >
          <span>Showing {filteredData.length} of {data.length} rows</span>
          {searchTerm && (
            <span className="flex items-center gap-1">
              <Search size={14} />
              <span>Filtered by "{searchTerm}"</span>
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}