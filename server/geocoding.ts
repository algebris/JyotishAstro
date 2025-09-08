interface GeocodingResult {
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
}

interface TimezoneResult {
  timezone: string;
  utcOffset: number; // in minutes
}

export class GeocodingService {
  // Использует OpenStreetMap Nominatim API (бесплатный)
  async searchPlaces(query: string, limit: number = 5): Promise<GeocodingResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=${limit}&addressdetails=1&extratags=1`,
        {
          headers: {
            'User-Agent': 'JyotishApp/1.0 (Educational Purpose)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        country: item.address?.country,
        region: item.address?.state || item.address?.region,
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  // Получает временную зону для координат
  async getTimezone(latitude: number, longitude: number): Promise<TimezoneResult> {
    try {
      // Используем TimeAPI для получения временной зоны
      const response = await fetch(
        `https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`
      );

      if (!response.ok) {
        // Если API недоступен, используем приблизительное определение по долготе
        return this.approximateTimezone(longitude);
      }

      const data = await response.json();
      
      return {
        timezone: data.timeZone || 'UTC',
        utcOffset: this.parseUtcOffset(data.currentUtcOffset || '+00:00'),
      };
    } catch (error) {
      console.error('Timezone API error:', error);
      // Fallback: приблизительное определение временной зоны
      return this.approximateTimezone(longitude);
    }
  }

  private parseUtcOffset(offsetString: string): number {
    // Парсит строки типа "+05:30" или "-03:00" в минуты
    const match = offsetString.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = parseInt(match[3]);
    
    return sign * (hours * 60 + minutes);
  }

  private approximateTimezone(longitude: number): TimezoneResult {
    // Приблизительное определение временной зоны по долготе
    // 15 градусов долготы ≈ 1 час
    const offsetHours = Math.round(longitude / 15);
    const clampedOffset = Math.max(-12, Math.min(12, offsetHours));
    
    return {
      timezone: `UTC${clampedOffset >= 0 ? '+' : ''}${clampedOffset}`,
      utcOffset: clampedOffset * 60,
    };
  }

  async geocodeAndGetTimezone(query: string): Promise<GeocodingResult & TimezoneResult | null> {
    const places = await this.searchPlaces(query, 1);
    if (places.length === 0) {
      return null;
    }

    const place = places[0];
    const timezone = await this.getTimezone(place.latitude, place.longitude);

    return {
      ...place,
      ...timezone,
    };
  }
}

export const geocodingService = new GeocodingService();