import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuzzleBobbleComponent } from './puzzle-bobble.component';

describe('PuzzleBobbleComponent', () => {
  let component: PuzzleBobbleComponent;
  let fixture: ComponentFixture<PuzzleBobbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuzzleBobbleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PuzzleBobbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
