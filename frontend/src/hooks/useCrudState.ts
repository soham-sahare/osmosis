import { useState } from 'react';

export interface CrudState<T> {
  isCreateOpen: boolean;
  setCreateOpen: (isOpen: boolean) => void;
  isEditOpen: boolean;
  setEditOpen: (isOpen: boolean) => void;
  isDeleteOpen: boolean;
  setDeleteOpen: (isOpen: boolean) => void;
  actionItem: T | null;
  prepareEdit: (item: T) => void;
  prepareDelete: (item: T) => void;
  processing: boolean;
  setProcessing: (isProcessing: boolean) => void;
  menuOpenId: string | null;
  toggleMenu: (e: React.MouseEvent, id: string) => void;
  closeMenu: () => void;
}

export function useCrudState<T>(): CrudState<T> {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionItem, setActionItem] = useState<T | null>(null);
  const [processing, setProcessing] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const prepareEdit = (item: T) => {
    setActionItem(item);
    setIsEditOpen(true);
    setMenuOpenId(null);
  };

  const prepareDelete = (item: T) => {
    setActionItem(item);
    setIsDeleteOpen(true);
    setMenuOpenId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const closeMenu = () => {
    setMenuOpenId(null);
  };

  return {
    isCreateOpen,
    setCreateOpen,
    isEditOpen,
    setEditOpen: setIsEditOpen,
    isDeleteOpen,
    setDeleteOpen: setIsDeleteOpen,
    actionItem,
    prepareEdit,
    prepareDelete,
    processing,
    setProcessing,
    menuOpenId,
    toggleMenu,
    closeMenu,
  };
}
