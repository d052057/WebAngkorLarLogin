import { Injectable, Inject} from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

/*import { environment } from '@environments/environment';*/
import { Account } from '@app/models';

/*const baseUrl = `${environment.apiUrl}/accounts`;*/

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account>;
    public account: Observable<Account>;
    baseUrl: string;
    constructor(
        private router: Router,
      private http: HttpClient,
      @Inject('BASE_URL') apiUrl: string
    ) {
        this.accountSubject = new BehaviorSubject<Account>(null);
      this.account = this.accountSubject.asObservable();
      this.baseUrl = apiUrl + 'accounts/';
      console.log("baseUrl=" + this.baseUrl);
    }

    public get accountValue(): Account {
        return this.accountSubject.value;
    }

    login(email: string, password: string) {
        return this.http.post<any>( this.baseUrl + 'authenticate', { email, password }, { withCredentials: true })
            .pipe(map(account => {
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    logout() {
      this.http.post<any>(this.baseUrl + 'revoke-token', {}, { withCredentials: true }).subscribe();
        this.stopRefreshTokenTimer();
        this.accountSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    refreshToken() {
      return this.http.post<any>(this.baseUrl + 'refresh-token', {}, { withCredentials: true })
            .pipe(map((account) => {
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    register(account: Account) {
      return this.http.post(this.baseUrl + 'register', account);
    }

    verifyEmail(token: string) {
      return this.http.post(this.baseUrl + 'verify-email', { token });
    }
    
    forgotPassword(email: string) {
      return this.http.post(this.baseUrl + 'forgot-password', { email });
    }
    
    validateResetToken(token: string) {
      return this.http.post(this.baseUrl + 'validate-reset-token', { token });
    }
    
    resetPassword(token: string, password: string, confirmPassword: string) {
      return this.http.post(this.baseUrl + 'reset-password', { token, password, confirmPassword });
    }

    getAll() {
        return this.http.get<Account[]>(this.baseUrl);
    }

    getById(id: string) {
        return this.http.get<Account>(this.baseUrl + `${id}`);
    }
    
    create(params) {
        return this.http.post(this.baseUrl, params);
    }
    
    update(id, params) {
        return this.http.put(this.baseUrl + `${id}`, params)
            .pipe(map((account: any) => {
                // update the current account if it was updated
                if (account.id === this.accountValue.id) {
                    // publish updated account to subscribers
                    account = { ...this.accountValue, ...account };
                    this.accountSubject.next(account);
                }
                return account;
            }));
    }
    
    delete(id: string) {
        return this.http.delete(this.baseUrl + `${id}`)
            .pipe(finalize(() => {
                // auto logout if the logged in account was deleted
                if (id === this.accountValue.id)
                    this.logout();
            }));
    }

    // helper methods

    private refreshTokenTimeout;

    private startRefreshTokenTimer() {
        // parse json object from base64 encoded jwt token
        const jwtToken = JSON.parse(atob(this.accountValue.jwtToken.split('.')[1]));

        // set a timeout to refresh the token a minute before it expires
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (60 * 1000);
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    }

    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }
}
