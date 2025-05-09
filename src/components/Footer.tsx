
const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} AgendaYa. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
