import React, { useMemo, useState } from "react";

const normalize = (value) => String(value ?? "").toLowerCase();

const toCsvCell = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const DataTable = ({
  columns,
  rows,
  rowKey = "_id",
  emptyMessage = "No records",
  fileName = "export.csv",
}) => {
  const [sortBy, setSortBy] = useState(columns[0]?.key || "");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filters, setFilters] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.reduce((acc, column) => ({ ...acc, [column.key]: true }), {})
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (globalFilter) {
        const rowHasGlobal = columns.some((column) => {
          const value = column.accessor ? column.accessor(row) : row[column.key];
          return normalize(value).includes(normalize(globalFilter));
        });
        if (!rowHasGlobal) return false;
      }

      return columns.every((column) => {
        const filterValue = filters[column.key];
        if (!filterValue) return true;
        const value = column.accessor ? column.accessor(row) : row[column.key];
        return normalize(value).includes(normalize(filterValue));
      });
    });
  }, [rows, columns, filters, globalFilter]);

  const sortedRows = useMemo(() => {
    if (!sortBy) return filteredRows;
    const column = columns.find((c) => c.key === sortBy);
    if (!column) return filteredRows;

    const next = [...filteredRows].sort((a, b) => {
      const left = column.accessor ? column.accessor(a) : a[sortBy];
      const right = column.accessor ? column.accessor(b) : b[sortBy];

      if (typeof left === "number" && typeof right === "number") return left - right;
      return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return sortDirection === "desc" ? next.reverse() : next;
  }, [filteredRows, sortBy, sortDirection, columns]);

  const visibleDefs = columns.filter((column) => visibleColumns[column.key]);

  const handleSort = (columnKey) => {
    if (sortBy === columnKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(columnKey);
    setSortDirection("asc");
  };

  const exportCsv = () => {
    const header = visibleDefs.map((c) => toCsvCell(c.label)).join(",");
    const body = sortedRows
      .map((row) =>
        visibleDefs
          .map((column) => {
            const value = column.csvValue
              ? column.csvValue(row)
              : column.accessor
                ? column.accessor(row)
                : row[column.key];
            return toCsvCell(value);
          })
          .join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="data-table-shell">
      <div className="data-table-toolbar">
        <input
          type="text"
          placeholder="Search all columns"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        <button type="button" className="btn-secondary data-table-export-btn" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="data-table-columns">
        {columns.map((column) => (
          <label key={column.key} className="data-table-column-toggle">
            <input
              type="checkbox"
              checked={!!visibleColumns[column.key]}
              onChange={(e) =>
                setVisibleColumns((prev) => ({ ...prev, [column.key]: e.target.checked }))
              }
            />
            {column.label}
          </label>
        ))}
      </div>

      <div className="data-table-wrap">
        <table>
          <thead>
            <tr>
              {visibleDefs.map((column) => (
                <th key={column.key}>
                  <button
                    type="button"
                    className="data-table-sort"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    {sortBy === column.key ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
            <tr>
              {visibleDefs.map((column) => (
                <th key={`${column.key}-filter`}>
                  <input
                    type="text"
                    placeholder={`Filter ${column.label}`}
                    value={filters[column.key] || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, [column.key]: e.target.value }))
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleDefs.length} className="text-muted" style={{ padding: "1rem" }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => (
                <tr key={row[rowKey] || index}>
                  {visibleDefs.map((column) => (
                    <td key={`${row[rowKey] || index}-${column.key}`}>
                      {column.render ? column.render(row) : column.accessor ? column.accessor(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
