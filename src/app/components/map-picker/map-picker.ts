import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

import { Location } from '../../models/settings';

// Set the default icon path for Leaflet
L.Icon.Default.imagePath = '/media/';

@Component({
  selector: 'app-map-picker',
  imports: [CommonModule],
  templateUrl: './map-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPicker implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  location = input<Location>({ lat: 0, lng: 0 });
  locationChange = output<Location>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    if (!this.mapContainer) return;

    // Initialize the map
    this.map = L.map(this.mapContainer.nativeElement).setView([-12.0464, -77.0428], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Initialize map with current location or default
    this.onMapInit(this.map);
  }

  private onMapInit(map: L.Map): void {
    this.map = map;

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.updateLocation(latitude, longitude);
          map.setView([latitude, longitude], 15);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Lima if geolocation fails
          this.updateLocation(-12.0464, -77.0428);
          map.setView([-12.0464, -77.0428], 13);
        },
      );
    } else {
      // Default to Lima if geolocation not supported
      this.updateLocation(-12.0464, -77.0428);
      map.setView([-12.0464, -77.0428], 13);
    }

    // Add click handler to update location
    map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  private updateLocation(lat: number, lng: number): void {
    // Emit the new location
    this.locationChange.emit({ lat, lng });

    // Update or create marker
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else if (this.map) {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }
  }
}
