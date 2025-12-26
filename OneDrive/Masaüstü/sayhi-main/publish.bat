cd sayhi.web
call npm run build
cd ..

dotnet build Sayhi.sln --no-restore --configuration Release

dotnet publish ./Sayhi.AIGateway -c Release
dotnet publish ./Sayhi.ApiService -c Release

dotnet publish ./Sayhi.AIGateway -c Release -r linux-x64
dotnet publish ./Sayhi.ApiService -c Release -r linux-x64

xcopy /E /I /Y .\sayhi.web\dist .\Sayhi.ApiService\bin\Release\net10.0\publish\wwwroot
xcopy /E /I /Y .\sayhi.web\dist .\Sayhi.ApiService\bin\Release\net10.0\linux-x64\publish\wwwroot
