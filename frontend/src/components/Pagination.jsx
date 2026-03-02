import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems,
  itemsPerPage,
  onPageChange 
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-white/5">
      <p className="text-sm text-gray-500">
        Mostrando <span className="text-white font-medium">{startItem}</span> a{" "}
        <span className="text-white font-medium">{endItem}</span> de{" "}
        <span className="text-white font-medium">{totalItems}</span> resultados
      </p>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? "bg-[#D4AF37] text-black font-bold hover:bg-[#B5952F] min-w-[32px]"
                : "text-gray-400 hover:text-white hover:bg-white/5 min-w-[32px]"
            }
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
