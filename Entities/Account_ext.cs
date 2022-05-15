namespace WebAngkorLar.Entities
{
    public partial class Account
    {
        public bool IsVerified => Verified.HasValue || PasswordReset.HasValue;
        public bool OwnsToken(string token)
        {
            return this.RefreshTokens.ToList().Find(x => x.Token == token) != null;
        }
    }
}
