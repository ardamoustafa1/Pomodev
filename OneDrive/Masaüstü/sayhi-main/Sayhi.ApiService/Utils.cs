using System.Security.Cryptography;
using System.Text;

namespace Sayhi.ApiService
{
    public static class Utils
    {
        public static string Hash(string input)
        {
            byte[] hashedBytes = MD5.HashData(Encoding.UTF8.GetBytes(input));

            //return Convert.ToBase64String(hashedBytes);
            return BitConverter.ToString(hashedBytes).Replace("-", "");
        }
    }
}
