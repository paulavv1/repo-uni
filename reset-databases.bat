@echo off
echo ========================================
echo Reseteando Bases de Datos
echo ========================================
echo.

echo [1/3] Reseteando base de datos AUTH...
call npx prisma migrate reset --force --config prisma-auth.config.ts
echo.

echo [2/3] Reseteando base de datos ACADEMIC...
call npx prisma migrate reset --force --config prisma-academic.config.ts
echo.

echo [3/3] Reseteando base de datos SUPPORT...
call npx prisma migrate reset --force --config prisma-support.config.ts
echo.

echo ========================================
echo Bases de datos reseteadas exitosamente!
echo ========================================
pause
