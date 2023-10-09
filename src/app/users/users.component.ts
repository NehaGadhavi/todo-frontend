import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: any = [];
  displayedColumns = ['id', 'name', 'role'];

  constructor(
    private apiService: ApiService,
  ){}

  
  ngOnInit(): void{
    this.apiService.getAllUsers().subscribe((users) => {
      this.users = users;
    })
  }
}
