import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Icon } from './icon.js';

describe('Icon', () => {
  let component: Icon;
  let fixture: ComponentFixture<Icon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icon],
    }).compileComponents();

    fixture = TestBed.createComponent(Icon);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render shield icon with svg element and aria-hidden', () => {
    fixture.componentRef.setInput('name', 'shield');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');

    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should render bolt icon with svg element and aria-hidden', () => {
    fixture.componentRef.setInput('name', 'bolt');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');

    const paths = svg.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should render palette icon with svg element and aria-hidden', () => {
    fixture.componentRef.setInput('name', 'palette');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');

    const circles = svg.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('should render logo icon with svg element and aria-hidden', () => {
    fixture.componentRef.setInput('name', 'logo');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');

    // Logo contains path elements
    const paths = svg.querySelectorAll('path, line, circle');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should render lock icon with svg element and aria-hidden', () => {
    fixture.componentRef.setInput('name', 'lock');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const svg = compiled.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');

    // Lock contains path, rect, and circle elements
    const elements = svg.querySelectorAll('path, rect, circle');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should update svg when name input changes', () => {
    fixture.componentRef.setInput('name', 'shield');
    fixture.detectChanges();

    let svgs = fixture.nativeElement.querySelectorAll('svg');
    expect(svgs.length).toBe(1);

    fixture.componentRef.setInput('name', 'bolt');
    fixture.detectChanges();

    svgs = fixture.nativeElement.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
  });

  it('should have proper viewBox for SVG icons', () => {
    const names: Array<'shield' | 'bolt' | 'palette' | 'logo' | 'lock'> = [
      'shield',
      'bolt',
      'palette',
      'logo',
      'lock',
    ];

    names.forEach((name) => {
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  it('should not have hardcoded colors in SVG elements', () => {
    const names: Array<'shield' | 'bolt' | 'palette' | 'logo' | 'lock'> = [
      'shield',
      'bolt',
      'palette',
      'logo',
      'lock',
    ];

    names.forEach((name) => {
      fixture.componentRef.setInput('name', name);
      fixture.detectChanges();

      const svg = fixture.nativeElement.querySelector('svg');
      const elementsWithColorAttrs = svg.querySelectorAll('[fill], [stroke]');

      elementsWithColorAttrs.forEach((el: SVGElement) => {
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');

        expect(fill === null || fill === 'currentColor' || fill === 'none').toBe(true);
        expect(stroke === null || stroke === 'currentColor' || stroke === 'none').toBe(true);
      });
    });
  });
});
