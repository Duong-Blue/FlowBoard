import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  Paperclip, 
  UploadCloud, 
  FileText, 
  Download, 
  Trash2, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { AppDispatch, RootState, Attachment } from '@/store/types';
import { fetchAttachments, uploadAttachment, deleteAttachment } from '@/store/slices/issueSlice';
import { Button } from '@/components/ui/button';

interface AttachmentSectionProps {
  projectId: string;
  issueId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentSection({ projectId, issueId }: AttachmentSectionProps) {
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAttachmentsLoading = useSelector((state: RootState) => state.issue.isAttachmentsLoading);
  const issue = useSelector((state: RootState) => 
    state.issue.list.find((i) => i.id === issueId || i.key?.toLowerCase() === issueId.toLowerCase())
  );
  const attachments: Attachment[] = issue?.attachments || [];

  useEffect(() => {
    if (projectId && issueId) {
      dispatch(fetchAttachments({ projectId, issueId }));
    }
  }, [dispatch, projectId, issueId]);

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    for (const file of fileList) {
      if (file.size > MAX_FILE_SIZE) {
        const msg = `File "${file.name}" exceeds maximum allowed size of 10MB (${formatFileSize(file.size)}).`;
        setErrorMsg(msg);
        toast.error(msg);
        continue;
      }

      try {
        setUploading(true);
        await dispatch(uploadAttachment({ projectId, issueId, file })).unwrap();
        toast.success(`Uploaded ${file.name}`);
      } catch (err: any) {
        const msg = err?.message || `Failed to upload ${file.name}`;
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId: string, filename: string) => {
    try {
      setDeletingId(attachmentId);
      await dispatch(deleteAttachment({ projectId, issueId, attachmentId })).unwrap();
      toast.success(`Deleted ${filename}`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to delete ${filename}`);
    } finally {
      setDeletingId(null);
    }
  };

  const isImage = (attachment: Attachment) => {
    if (attachment.mimeType && attachment.mimeType.startsWith('image/')) {
      return true;
    }
    const ext = attachment.filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
  };

  const getDownloadUrl = (attachment: Attachment) => {
    return `/api/projects/${projectId}/issues/${issueId}/attachments/${attachment.id}/download`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Attachments ({attachments.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4 mr-2" />
          )}
          Upload File
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border hover:border-muted-foreground/50 bg-muted/20'
        }`}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop files here, or <span className="text-primary hover:underline">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Supports any file type up to 10MB
        </p>
      </div>

      {/* Validation / Error Message */}
      {errorMsg && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading state */}
      {isAttachmentsLoading && attachments.length === 0 && (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading attachments...
        </div>
      )}

      {/* Attachment List / Cards */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((attachment) => {
            const downloadUrl = getDownloadUrl(attachment);
            const imageFile = isImage(attachment);

            return (
              <div
                key={attachment.id}
                className="group relative flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
              >
                {/* Thumbnail / Icon */}
                <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border">
                  {imageFile ? (
                    <img
                      src={attachment.url || downloadUrl}
                      alt={attachment.filename}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.className = 'text-muted-foreground';
                          icon.innerHTML = '<svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/></svg>';
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Metadata */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate" title={attachment.filename}>
                    {attachment.filename}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={downloadUrl}
                    download={attachment.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download attachment"
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(attachment.id, attachment.filename)}
                    disabled={deletingId === attachment.id}
                    title="Delete attachment"
                  >
                    {deletingId === attachment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
