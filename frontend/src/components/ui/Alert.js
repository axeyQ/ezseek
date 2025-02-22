// src/components/ui/Alert.js
export function Alert({ children, variant = 'default', className = '' }) {
    const baseStyles = 'px-4 py-3 rounded-lg mb-4 flex items-start';
    
    const variantStyles = {
      default: 'bg-blue-50 text-blue-800 border border-blue-200',
      success: 'bg-green-50 text-green-800 border border-green-200',
      warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
      error: 'bg-red-50 text-red-800 border border-red-200'
    };
  
    return (
      <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
        {children}
      </div>
    );
  }
  
  export function AlertDescription({ children, className = '' }) {
    return (
      <div className={`text-sm ${className}`}>
        {children}
      </div>
    );
  }