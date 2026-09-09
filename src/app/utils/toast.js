// Simple toast notification utility
export const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-opacity duration-300 ${
    type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
  }`;
  toast.textContent = message;
  toast.style.opacity = '0';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};
