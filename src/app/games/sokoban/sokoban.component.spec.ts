import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SokobanComponent } from './sokoban.component';

describe('SokobanComponent', () => {
  let component: SokobanComponent;
  let fixture: ComponentFixture<SokobanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SokobanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SokobanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
