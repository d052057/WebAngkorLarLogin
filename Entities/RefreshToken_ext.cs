using System;
using System.Collections.Generic;

namespace WebAngkorLar.Entities
{
    public partial class RefreshToken
    {
        public bool IsExpired => DateTime.UtcNow >= Expires;
        public bool IsRevoked => Revoked is not null;
        public bool IsActive => Revoked is null && !IsExpired;
    }
}
