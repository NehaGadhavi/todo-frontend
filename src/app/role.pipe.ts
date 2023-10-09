import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'role'
})
export class RolePipe implements PipeTransform {

  transform(value: number): string {
    switch (value) {
      case 0:
        return 'Admin';
      case 1:
        return 'User';
      default:
        return 'Unknown';
    }
  }

}
