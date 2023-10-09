import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private token = '';
  private jwtToken$ = new BehaviorSubject<string>(this.token);
  private apiUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: ToastrService
  ) {
    const fetchedToken = localStorage.getItem('act');

    if (fetchedToken) {
      this.token = atob(fetchedToken);
      this.jwtToken$.next(this.token);
    }
  }

  get jwtUserToken(): Observable<string> {
    return this.jwtToken$.asObservable();
  }

  //Get all Todos
  getAllTodos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/todos`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
  }

  getAllUsers(): Observable<any>{
    return this.http.get(`${this.apiUrl}/auth/users`);
  }

  login(username: string, password: string) {
    axios.post(`${this.apiUrl}/auth/login`, { username, password })
      .then((response) => {
        const res = response.data;
        this.token = res.token;
  
        if (this.token) {
          this.toast.success('Login successful, redirecting now...', '', {
            timeOut: 1000,
            positionClass: 'toast-top-center'
          });
        }
  
        this.jwtToken$.next(this.token);
        localStorage.setItem('act', btoa(this.token));
        this.router.navigateByUrl('/').then();
      })
      .catch((error) => {
        this.toast.error('Authentication Failed!', '', {
          timeOut: 1000
        })
        console.log(error.message);
      });
  }

  register(username: string, password: string) {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, password }).pipe(
      tap(() => {
        this.toast.success('User registered successfully.', '', {
          timeOut: 1000
        });
      }),
      catchError((err: HttpErrorResponse) => {
        this.toast.error(err.message, '', {
          timeOut: 1000
        });
        throw err;
      })
    );
  }

  logout() {
    this.token = '';
    this.jwtToken$.next(this.token);
    this.toast.success('Logged out successfully', '', {
      timeOut: 500
    }).onHidden.subscribe(() => {
      localStorage.removeItem('act');
      this.router.navigateByUrl('/login').then();
    });
    return '';
  }

  createTodo(title: string, description: string) {
    return this.http.post(`${this.apiUrl}/todos`, {title, description}, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
  }

  updateStatus(statusValue: string, todoId: number) {
    return this.http.patch(`${this.apiUrl}/todos/admin/${todoId}`, {status: statusValue}, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }).pipe(
      tap(res => {
        if (res) {
          this.toast.success('Status updated successfully', '', {
            timeOut: 1000
          });
        }
      })
    );
  }

  updateOwnStatus(statusValue: string, todoId: number) {
    return this.http.patch(`${this.apiUrl}/todos/user/${todoId}`, {status: statusValue}, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }).pipe(
      tap(res => {
        if (res) {
          this.toast.success('Status updated successfully', '', {
            timeOut: 1000
          });
        }
      })
    );
  }

  deleteTodo(todoId: number) {
    return this.http.delete(`${this.apiUrl}/todos/${todoId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }).pipe(
      tap(res => {
        // @ts-ignore
        if (res.success) {
          this.toast.success('Todo deleted successfully');
        }
      })
    );
  }

  updateTimer(todoId: number, timer: number){
    return this.http.patch(`${this.apiUrl}/todos/${todoId}`, {timer: timer},{
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }).pipe(
        tap(res => {
          this.toast.success('Timer updated successfully', '', {
            timeOut: 1000
          });
        })
      )
  }

  moveToArchive(todoId: number){
    return this.http.patch(`${this.apiUrl}/todos/not-done/${todoId}`,{}, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    }).pipe(
      tap(res => {
        this.toast.warning('Todo has been moved to Archive', '', {
          timeOut: 1000
        });
      })
    )
  }

}
