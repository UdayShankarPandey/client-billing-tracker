import React from "react";
import EmptyState from "./EmptyState";
import SkeletonLoader from "./SkeletonLoader";

const StateWrapper = ({
  loading,
  error,
  isEmpty,
  emptyTitle = "No data",
  emptyDescription = "Nothing to show yet.",
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  loadingContent,
  children,
}) => {
  if (loading) {
    return loadingContent || (
      <div className="card">
        <SkeletonLoader lines={6} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <>
      {error ? (
        <div className="alert alert-warning">
          {error}
          {onRetry ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginLeft: 12, padding: "0.3rem 0.65rem" }}
              onClick={onRetry}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </>
  );
};

export default StateWrapper;
