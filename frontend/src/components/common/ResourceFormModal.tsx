import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  title: string;
  initialName?: string;
  initialDescription?: string;
  processing?: boolean;
  confirmLabel?: string;
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialName = '',
  initialDescription = '',
  processing = false,
  confirmLabel = 'Save'
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (isOpen) {
        setName(initialName);
        setDescription(initialDescription);
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name, description);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <Input
          label="Name"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Description (Optional)"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={processing}
            disabled={!name.trim()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
