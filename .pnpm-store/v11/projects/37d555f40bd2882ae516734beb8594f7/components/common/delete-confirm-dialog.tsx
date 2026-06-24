"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { Icon } from "@/components/inventory/icon";
import styles from "./delete-confirm-dialog.module.css";

type DeleteConfirmDialogProps = {
  subject: string;
  title?: string;
  eyebrow?: string;
  description?: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConfirmDialog({
  subject,
  title = "Eliminar registro",
  eyebrow = "Acción irreversible",
  description,
  confirmLabel = "Sí, eliminar",
  loading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (!loading && event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className={styles.icon}>
          <Icon name="warning" />
        </div>

        <div className={styles.copy}>
          <p>{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
          <span id={descriptionId}>
            {description ?? (
              <>
                ¿Seguro que deseas eliminar <strong>{subject}</strong>? Esta acción no se puede deshacer.
              </>
            )}
          </span>
        </div>

        <footer>
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            <Icon name="trash" /> {loading ? "Eliminando..." : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
