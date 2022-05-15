Scaffold-DbContext "Data Source=.\SQLEXPRESS;Initial Catalog=yitong;User ID=sa;password=sa" Microsoft.EntityFrameworkCore.SqlServer -OutputDir test
add-migration initial -context DataContext
update-database -context DataContext