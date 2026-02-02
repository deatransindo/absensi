'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import styles from '@/styles/UsersTable.module.css';

export default function UsersTable({ users, onEdit, onDelete }) {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: (info) => {
          const role = info.getValue();
          return (
            <span className={`${styles.badge} ${styles[role]}`}>
              {role}
            </span>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: (info) => {
          const isActive = info.getValue();
          return (
            <span
              className={`${styles.badge} ${
                isActive ? styles.active : styles.inactive
              }`}
            >
              {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Terdaftar',
        cell: (info) => {
          const date = new Date(info.getValue());
          return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className={styles.actions}>
              <button
                className={styles.editBtn}
                onClick={() => onEdit(user)}
              >
                Edit
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(user)}
              >
                Hapus
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      globalFilter: filtering,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={styles.tableContainer}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Cari user (nama, email, role)..."
          value={filtering}
          onChange={(e) => setFiltering(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={
                      header.column.getCanSort() ? styles.sortable : ''
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() && (
                      <span className={styles.sortIcon}>
                        {header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className={styles.paginationBtn}
        >
          {'<<'}
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={styles.paginationBtn}
        >
          {'<'}
        </button>
        <span className={styles.pageInfo}>
          Halaman{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} dari{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={styles.paginationBtn}
        >
          {'>'}
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className={styles.paginationBtn}
        >
          {'>>'}
        </button>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className={styles.pageSizeSelect}
        >
          {[5, 10, 20, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Tampilkan {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
