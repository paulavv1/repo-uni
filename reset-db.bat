@echo off
echo ========================================
echo RESETEANDO BASES DE DATOS
echo ========================================
echo.

echo [1/3] Reseteando AUTH Database...
call npx prisma db push --force-reset --config prisma-auth.config.ts
echo.

echo [2/3] Reseteando ACADEMIC Database...
call npx prisma db push --force-reset --config prisma-academic.config.ts
echo.

echo [3/3] Reseteando SUPPORT Database...
call npx prisma db push --force-reset --config prisma-support.config.ts
echo.

echo ========================================
echo BASES DE DATOS RESETEADAS!
echo ========================================
echo.
echo Ahora puedes ejecutar las peticiones de Postman
pause
