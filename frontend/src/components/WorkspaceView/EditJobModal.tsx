import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  processing?: boolean;
}

export const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = '',
  initialDescription = '',
  processing = false,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setError('');
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Job name is required');
      return;
    }
    
    try {
      await onSubmit(name, description);
    } catch (err) {
      // Error handling passed down from parent or handled there
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Job"
      size="md"
    >
        <div className="space-y-6">
            <div>
                <Input
                    label="Name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                    }}
                    error={error}
                    placeholder="e.g. Sales Pipeline"
                    autoFocus
                />
            </div>
            
            <div>
                <Textarea
                    label="Description (Optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description..."
                    rows={4}
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-[#2a2a2a]">
            <Button variant="secondary" onClick={onClose} disabled={processing}>
                Cancel
            </Button>
            <Button 
                variant="primary" 
                onClick={handleSubmit} 
                loading={processing}
            >
                Save Changes
            </Button>
        </div>
    </Modal>
  );
};
