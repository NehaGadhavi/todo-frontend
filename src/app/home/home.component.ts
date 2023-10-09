import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TodoComponent } from '../todo/todo.component';
import { ApiService } from '../services/api.service';
import { MatSelectChange } from '@angular/material/select';
import jwtDecode from 'jwt-decode';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  todos: any = [];
  filteredTodos: any[] = [];
  isAdmin?: boolean = false;
  expiredTodos: number[] = [];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private toast: ToastrService,
  ) { }

  ngOnInit(): void {
    this.apiService.getAllTodos().subscribe((todos) => {
      this.todos = todos;
      this.filteredTodos = this.todos;
      this.startTimer();
    });

    this.isAdminLoggedIn();
  }

  getCompletionPercentage(): number {
    const completedTodoCount = this.filteredTodos.filter((t) => t.status === 'COMPLETED').length;
    const totalTodoCount = this.filteredTodos.length;
    return (completedTodoCount / totalTodoCount) * 100;
  }


  isAdminLoggedIn() {
    this.apiService.jwtUserToken.subscribe((token) => {
      if (token) {
        const decoded: any = jwtDecode(token);
        if (decoded.roles === 0) {
          this.isAdmin = true;
        } else {
          this.isAdmin = false;
        }
      }
    });
  }

  filterChanged(e: MatSelectChange) {
    const value = e.value;
    this.filteredTodos = this.todos;
    if (value) {
      this.filteredTodos = this.filteredTodos.filter((t) => t.status === value);
    } else {
      this.filteredTodos = this.todos;
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(TodoComponent, {
      width: '500px',
      hasBackdrop: true,
      role: 'dialog',
      height: '500px',
    });

    dialogRef.afterClosed().subscribe((data) => {
      this.apiService.createTodo(data.title, data.description).subscribe((result: any) => {
        this.todos.push(result);
        this.filteredTodos = this.todos;
        this.startTimer(result.id);
      });
    });
  }

  statusChanged(ev: MatSelectChange, todoId: number, index: number) {
    const value = ev.value;
    if (this.isAdmin) {
      this.apiService.updateStatus(value, todoId).subscribe((todo) => {
        this.todos[index] = todo;
        this.filteredTodos = this.todos;
      });
    } else {
      this.apiService.updateOwnStatus(value, todoId).subscribe((todo) => {
        this.todos[index] = todo;
        this.filteredTodos = this.todos;
      });
    }

    if (this.todos[index].status === 'COMPLETED') {
      this.stopTimer(this.todos[index].id);
    } else {
      if (this.todos[index].status === 'OPEN') {
        this.apiService.updateTimer(this.todos[index].id, 300).subscribe((todo: any) => {
          const index = this.todos.findIndex((t: any) => t.id === todo.id);
          if (index !== -1) {
            this.todos[index] = todo;
            this.filteredTodos = this.todos;
          }
        });;
        this.startTimer(this.todos[index].id);
      }
    }
  }

  delete(id: number) {
    if (confirm('Do you want to remove the Todo?')) {
      this.apiService.deleteTodo(id).subscribe((res) => {
        if (res) {
          this.todos = this.todos.filter((t: any) => t.id !== id);
          this.filteredTodos = this.todos;
        }
      });
    }
  }

  todoExpired(id: number, status: string) {
    if (status !== 'COMPLETED' && !this.expiredTodos.includes(id)) {
      this.expiredTodos.push(id);
      this.apiService.moveToArchive(id).subscribe((todo: any) => {
        const index = this.todos.findIndex((t: any) => t.id === todo.id);
        if (index !== -1) {
          this.todos[index] = todo;
          this.filteredTodos = this.todos;
        }
      })
      this.toast.warning('Todo expired!!', String(id), {
        timeOut: 1000,
        positionClass: 'toast-top-center',
      });
    }
  }

  startTimer(id?: number) {
    for (let i = 0; i < this.filteredTodos.length; i++) {
      if (id) {
        if (this.filteredTodos[i].id === id) {
          if (this.filteredTodos[i].status !== 'COMPLETED') {
            clearInterval(this.filteredTodos[i].interval); // Clear existing interval
            this.filteredTodos[i].interval = setInterval(() => {
              if (this.filteredTodos[i].timer <= 0) {
                this.todoExpired(id, this.filteredTodos[i].status);
                clearInterval(this.filteredTodos[i].interval);
              } else {
                this.filteredTodos[i].timer--;
              }
            }, 1000);
          }
        }
      } else {
        if (this.filteredTodos[i].status !== 'COMPLETED') {
          clearInterval(this.filteredTodos[i].interval); // Clear existing interval
          this.filteredTodos[i].interval = setInterval(() => {
            if (this.filteredTodos[i].timer <= 0) {
              this.todoExpired(this.filteredTodos[i].id, this.filteredTodos[i].status);
              clearInterval(this.filteredTodos[i].interval);
            } else {
              this.filteredTodos[i].timer--;
            }
          }, 1000);
        }
      }
    }
  }

  stopTimer(todoId: number) {
    for (let i = 0; i < this.filteredTodos.length; i++) {
      if (this.filteredTodos[i].id === todoId) {
        const stoppetAt = this.filteredTodos[i].timer;
        this.apiService.updateTimer(todoId, stoppetAt).subscribe((res) => {
          console.log(res);
        });
        this.toast.info(`Timer stopped at ${stoppetAt}`, String(todoId), {
          timeOut: 3000,
          positionClass: 'toast-top-center',
        });
        break;
      }
    }
  }
}