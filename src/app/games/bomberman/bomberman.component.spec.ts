import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BombermanComponent } from './bomberman.component';

describe('BombermanComponent', () => {
  let component: BombermanComponent;
  let fixture: ComponentFixture<BombermanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BombermanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BombermanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
