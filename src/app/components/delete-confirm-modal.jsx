import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Trash2, X } from "lucide-react";

export function DeleteConfirmModal({
  open,
  title = "Delete Item",
  message,
  itemName,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {message ?? (
                <>
                  Are you sure you want to delete
                  {itemName ? (
                    <> <span className="font-semibold text-gray-900">"{itemName}"</span>?</>
                  ) : (
                    " this item?"
                  )}{" "}
                  This action cannot be undone.
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-gray-200"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
            >
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
