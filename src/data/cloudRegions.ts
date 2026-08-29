/**
 * Real public-cloud region locations, plotted as the colored dots on the hero
 * map and counted by the coverage strip.
 *
 * Coordinates are the announced metro for each region, not datacenter
 * addresses. Government, secret, and China-partition-only regions that are not
 * generally available are omitted.
 */

export type ProviderId = 'aws' | 'azure' | 'gcp' | 'alibaba' | 'oracle' | 'ibm'

export interface Provider {
  id: ProviderId
  name: string
  /** Base hue. The map shifts lightness per theme; see tokens.css. */
  color: string
}

export const PROVIDERS: Provider[] = [
  { id: 'aws', name: 'AWS', color: '#FF9900' },
  { id: 'azure', name: 'Azure', color: '#38BDF8' },
  { id: 'gcp', name: 'Google Cloud', color: '#34D399' },
  { id: 'alibaba', name: 'Alibaba Cloud', color: '#F472B6' },
  { id: 'oracle', name: 'Oracle Cloud', color: '#EF4444' },
  { id: 'ibm', name: 'IBM Cloud', color: '#A78BFA' },
]

export const PROVIDER_BY_ID: Record<ProviderId, Provider> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<ProviderId, Provider>

export interface CloudRegion {
  provider: ProviderId
  /** Provider's own region identifier, e.g. `eu-central-1`. */
  code: string
  /** Metro the region is named for. */
  city: string
  lat: number
  lng: number
}

/** [code, city, lat, lng] — compact so the table stays readable. */
type RawRegion = [string, string, number, number]

const RAW: Record<ProviderId, RawRegion[]> = {
  aws: [
    ['us-east-1', 'N. Virginia', 38.95, -77.45],
    ['us-east-2', 'Ohio', 40.42, -82.91],
    ['us-west-1', 'N. California', 37.35, -121.96],
    ['us-west-2', 'Oregon', 45.87, -119.69],
    ['ca-central-1', 'Montreal', 45.5, -73.57],
    ['ca-west-1', 'Calgary', 51.05, -114.07],
    ['mx-central-1', 'Mexico City', 19.43, -99.13],
    ['sa-east-1', 'São Paulo', -23.55, -46.63],
    ['eu-west-1', 'Ireland', 53.35, -6.26],
    ['eu-west-2', 'London', 51.51, -0.13],
    ['eu-west-3', 'Paris', 48.86, 2.35],
    ['eu-central-1', 'Frankfurt', 50.11, 8.68],
    ['eu-central-2', 'Zurich', 47.37, 8.54],
    ['eu-north-1', 'Stockholm', 59.33, 18.07],
    ['eu-south-1', 'Milan', 45.46, 9.19],
    ['eu-south-2', 'Spain', 40.42, -3.7],
    ['il-central-1', 'Tel Aviv', 32.07, 34.78],
    ['me-south-1', 'Bahrain', 26.07, 50.56],
    ['me-central-1', 'UAE', 24.45, 54.38],
    ['af-south-1', 'Cape Town', -33.93, 18.42],
    ['ap-east-1', 'Hong Kong', 22.27, 114.17],
    ['ap-east-2', 'Taipei', 25.03, 121.57],
    ['ap-south-1', 'Mumbai', 19.08, 72.88],
    ['ap-south-2', 'Hyderabad', 17.38, 78.49],
    ['ap-northeast-1', 'Tokyo', 35.68, 139.69],
    ['ap-northeast-2', 'Seoul', 37.57, 126.98],
    ['ap-northeast-3', 'Osaka', 34.69, 135.5],
    ['ap-southeast-1', 'Singapore', 1.35, 103.82],
    ['ap-southeast-2', 'Sydney', -33.87, 151.21],
    ['ap-southeast-3', 'Jakarta', -6.21, 106.85],
    ['ap-southeast-4', 'Melbourne', -37.81, 144.96],
    ['ap-southeast-5', 'Malaysia', 3.14, 101.69],
    ['ap-southeast-7', 'Thailand', 13.76, 100.5],
    ['cn-north-1', 'Beijing', 39.9, 116.41],
    ['cn-northwest-1', 'Ningxia', 38.47, 106.27],
  ],
  azure: [
    ['eastus', 'Virginia', 37.37, -79.82],
    ['eastus2', 'Virginia', 36.67, -78.39],
    ['centralus', 'Iowa', 41.59, -93.62],
    ['northcentralus', 'Illinois', 41.88, -87.63],
    ['southcentralus', 'Texas', 29.42, -98.49],
    ['westcentralus', 'Wyoming', 40.89, -110.23],
    ['westus', 'California', 37.78, -122.42],
    ['westus2', 'Washington', 47.23, -119.85],
    ['westus3', 'Arizona', 33.45, -112.07],
    ['canadacentral', 'Toronto', 43.65, -79.38],
    ['canadaeast', 'Quebec City', 46.81, -71.21],
    ['mexicocentral', 'Querétaro', 20.59, -100.39],
    ['brazilsouth', 'São Paulo', -23.55, -46.63],
    ['brazilsoutheast', 'Rio de Janeiro', -22.91, -43.17],
    ['chilecentral', 'Santiago', -33.45, -70.67],
    ['northeurope', 'Ireland', 53.35, -6.26],
    ['westeurope', 'Netherlands', 52.37, 4.9],
    ['uksouth', 'London', 51.51, -0.13],
    ['ukwest', 'Cardiff', 51.48, -3.18],
    ['francecentral', 'Paris', 46.36, 2.37],
    ['francesouth', 'Marseille', 43.3, 5.37],
    ['germanywestcentral', 'Frankfurt', 50.11, 8.68],
    ['germanynorth', 'Berlin', 52.52, 13.4],
    ['norwayeast', 'Oslo', 59.91, 10.75],
    ['norwaywest', 'Stavanger', 58.97, 5.73],
    ['swedencentral', 'Gävle', 60.67, 17.14],
    ['switzerlandnorth', 'Zurich', 47.37, 8.54],
    ['switzerlandwest', 'Geneva', 46.2, 6.14],
    ['polandcentral', 'Warsaw', 52.23, 21.01],
    ['italynorth', 'Milan', 45.46, 9.19],
    ['spaincentral', 'Madrid', 40.42, -3.7],
    ['israelcentral', 'Israel', 31.77, 35.21],
    ['qatarcentral', 'Doha', 25.29, 51.53],
    ['uaenorth', 'Dubai', 25.2, 55.27],
    ['uaecentral', 'Abu Dhabi', 24.45, 54.38],
    ['southafricanorth', 'Johannesburg', -26.2, 28.05],
    ['southafricawest', 'Cape Town', -33.93, 18.42],
    ['eastasia', 'Hong Kong', 22.27, 114.17],
    ['southeastasia', 'Singapore', 1.35, 103.82],
    ['japaneast', 'Tokyo', 35.68, 139.69],
    ['japanwest', 'Osaka', 34.69, 135.5],
    ['koreacentral', 'Seoul', 37.57, 126.98],
    ['koreasouth', 'Busan', 35.18, 129.08],
    ['centralindia', 'Pune', 18.52, 73.86],
    ['southindia', 'Chennai', 13.08, 80.27],
    ['westindia', 'Mumbai', 19.08, 72.88],
    ['indonesiacentral', 'Jakarta', -6.21, 106.85],
    ['malaysiawest', 'Kuala Lumpur', 3.14, 101.69],
    ['australiaeast', 'Sydney', -33.87, 151.21],
    ['australiasoutheast', 'Melbourne', -37.81, 144.96],
    ['australiacentral', 'Canberra', -35.28, 149.13],
    ['newzealandnorth', 'Auckland', -36.85, 174.76],
  ],
  gcp: [
    ['us-central1', 'Iowa', 41.26, -95.86],
    ['us-east1', 'South Carolina', 33.2, -80.01],
    ['us-east4', 'N. Virginia', 39.03, -77.47],
    ['us-east5', 'Columbus', 39.96, -83.0],
    ['us-south1', 'Dallas', 32.78, -96.8],
    ['us-west1', 'Oregon', 45.6, -121.18],
    ['us-west2', 'Los Angeles', 34.05, -118.24],
    ['us-west3', 'Salt Lake City', 40.76, -111.89],
    ['us-west4', 'Las Vegas', 36.17, -115.14],
    ['northamerica-northeast1', 'Montreal', 45.5, -73.57],
    ['northamerica-northeast2', 'Toronto', 43.65, -79.38],
    ['northamerica-south1', 'Querétaro', 20.59, -100.39],
    ['southamerica-east1', 'São Paulo', -23.55, -46.63],
    ['southamerica-west1', 'Santiago', -33.45, -70.67],
    ['europe-west1', 'Belgium', 50.47, 3.82],
    ['europe-west2', 'London', 51.51, -0.13],
    ['europe-west3', 'Frankfurt', 50.11, 8.68],
    ['europe-west4', 'Netherlands', 53.44, 6.83],
    ['europe-west6', 'Zurich', 47.37, 8.54],
    ['europe-west8', 'Milan', 45.46, 9.19],
    ['europe-west9', 'Paris', 48.86, 2.35],
    ['europe-west10', 'Berlin', 52.52, 13.4],
    ['europe-west12', 'Turin', 45.07, 7.69],
    ['europe-north1', 'Finland', 60.57, 27.19],
    ['europe-central2', 'Warsaw', 52.23, 21.01],
    ['europe-southwest1', 'Madrid', 40.42, -3.7],
    ['me-west1', 'Tel Aviv', 32.07, 34.78],
    ['me-central1', 'Doha', 25.29, 51.53],
    ['me-central2', 'Dammam', 26.43, 50.1],
    ['asia-east1', 'Taiwan', 24.08, 120.54],
    ['asia-east2', 'Hong Kong', 22.27, 114.17],
    ['asia-northeast1', 'Tokyo', 35.68, 139.69],
    ['asia-northeast2', 'Osaka', 34.69, 135.5],
    ['asia-northeast3', 'Seoul', 37.57, 126.98],
    ['asia-south1', 'Mumbai', 19.08, 72.88],
    ['asia-south2', 'Delhi', 28.61, 77.21],
    ['asia-southeast1', 'Singapore', 1.35, 103.82],
    ['asia-southeast2', 'Jakarta', -6.21, 106.85],
    ['australia-southeast1', 'Sydney', -33.87, 151.21],
    ['australia-southeast2', 'Melbourne', -37.81, 144.96],
    ['africa-south1', 'Johannesburg', -26.2, 28.05],
  ],
  alibaba: [
    ['cn-hangzhou', 'Hangzhou', 30.27, 120.16],
    ['cn-shanghai', 'Shanghai', 31.23, 121.47],
    ['cn-qingdao', 'Qingdao', 36.07, 120.38],
    ['cn-beijing', 'Beijing', 39.9, 116.41],
    ['cn-zhangjiakou', 'Zhangjiakou', 40.77, 114.89],
    ['cn-huhehaote', 'Hohhot', 40.84, 111.75],
    ['cn-wulanchabu', 'Ulanqab', 41.02, 113.13],
    ['cn-shenzhen', 'Shenzhen', 22.54, 114.06],
    ['cn-heyuan', 'Heyuan', 23.74, 114.7],
    ['cn-guangzhou', 'Guangzhou', 23.13, 113.26],
    ['cn-chengdu', 'Chengdu', 30.57, 104.07],
    ['cn-hongkong', 'Hong Kong', 22.27, 114.17],
    ['ap-northeast-1', 'Tokyo', 35.68, 139.69],
    ['ap-northeast-2', 'Seoul', 37.57, 126.98],
    ['ap-southeast-1', 'Singapore', 1.35, 103.82],
    ['ap-southeast-3', 'Kuala Lumpur', 3.14, 101.69],
    ['ap-southeast-5', 'Jakarta', -6.21, 106.85],
    ['ap-southeast-6', 'Manila', 14.6, 120.98],
    ['ap-southeast-7', 'Bangkok', 13.76, 100.5],
    ['ap-south-1', 'Mumbai', 19.08, 72.88],
    ['us-east-1', 'Virginia', 37.43, -78.66],
    ['us-west-1', 'Silicon Valley', 37.39, -122.08],
    ['na-south-1', 'Mexico City', 19.43, -99.13],
    ['eu-west-1', 'London', 51.51, -0.13],
    ['eu-central-1', 'Frankfurt', 50.11, 8.68],
    ['me-east-1', 'Dubai', 25.2, 55.27],
    ['me-central-1', 'Riyadh', 24.71, 46.68],
  ],
  oracle: [
    ['us-ashburn-1', 'Ashburn', 39.04, -77.49],
    ['us-phoenix-1', 'Phoenix', 33.45, -112.07],
    ['us-sanjose-1', 'San Jose', 37.34, -121.89],
    ['us-chicago-1', 'Chicago', 41.88, -87.63],
    ['ca-toronto-1', 'Toronto', 43.65, -79.38],
    ['ca-montreal-1', 'Montreal', 45.5, -73.57],
    ['mx-queretaro-1', 'Querétaro', 20.59, -100.39],
    ['mx-monterrey-1', 'Monterrey', 25.69, -100.32],
    ['sa-saopaulo-1', 'São Paulo', -23.55, -46.63],
    ['sa-vinhedo-1', 'Vinhedo', -23.03, -46.98],
    ['sa-santiago-1', 'Santiago', -33.45, -70.67],
    ['sa-valparaiso-1', 'Valparaíso', -33.05, -71.62],
    ['sa-bogota-1', 'Bogotá', 4.71, -74.07],
    ['uk-london-1', 'London', 51.51, -0.13],
    ['uk-cardiff-1', 'Cardiff', 51.48, -3.18],
    ['eu-frankfurt-1', 'Frankfurt', 50.11, 8.68],
    ['eu-amsterdam-1', 'Amsterdam', 52.37, 4.9],
    ['eu-zurich-1', 'Zurich', 47.37, 8.54],
    ['eu-madrid-1', 'Madrid', 40.42, -3.7],
    ['eu-marseille-1', 'Marseille', 43.3, 5.37],
    ['eu-milan-1', 'Milan', 45.46, 9.19],
    ['eu-paris-1', 'Paris', 48.86, 2.35],
    ['eu-stockholm-1', 'Stockholm', 59.33, 18.07],
    ['il-jerusalem-1', 'Jerusalem', 31.77, 35.21],
    ['me-jeddah-1', 'Jeddah', 21.49, 39.19],
    ['me-riyadh-1', 'Riyadh', 24.71, 46.68],
    ['me-abudhabi-1', 'Abu Dhabi', 24.45, 54.38],
    ['me-dubai-1', 'Dubai', 25.2, 55.27],
    ['ap-mumbai-1', 'Mumbai', 19.08, 72.88],
    ['ap-hyderabad-1', 'Hyderabad', 17.38, 78.49],
    ['ap-singapore-1', 'Singapore', 1.35, 103.82],
    ['ap-tokyo-1', 'Tokyo', 35.68, 139.69],
    ['ap-osaka-1', 'Osaka', 34.69, 135.5],
    ['ap-seoul-1', 'Seoul', 37.57, 126.98],
    ['ap-chuncheon-1', 'Chuncheon', 37.87, 127.73],
    ['ap-sydney-1', 'Sydney', -33.87, 151.21],
    ['ap-melbourne-1', 'Melbourne', -37.81, 144.96],
    ['af-johannesburg-1', 'Johannesburg', -26.2, 28.05],
  ],
  ibm: [
    ['us-south', 'Dallas', 32.78, -96.8],
    ['us-east', 'Washington DC', 38.91, -77.04],
    ['ca-tor', 'Toronto', 43.65, -79.38],
    ['ca-mon', 'Montreal', 45.5, -73.57],
    ['br-sao', 'São Paulo', -23.55, -46.63],
    ['eu-gb', 'London', 51.51, -0.13],
    ['eu-de', 'Frankfurt', 50.11, 8.68],
    ['eu-es', 'Madrid', 40.42, -3.7],
    ['jp-tok', 'Tokyo', 35.68, 139.69],
    ['jp-osa', 'Osaka', 34.69, 135.5],
    ['au-syd', 'Sydney', -33.87, 151.21],
  ],
}

export const CLOUD_REGIONS: CloudRegion[] = (
  Object.entries(RAW) as [ProviderId, RawRegion[]][]
).flatMap(([provider, rows]) =>
  rows.map(([code, city, lat, lng]) => ({ provider, code, city, lat, lng })),
)

/** Region count per provider, used by the coverage strip. */
export const REGION_COUNTS: Record<ProviderId, number> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, RAW[p.id].length]),
) as Record<ProviderId, number>

export const TOTAL_REGIONS = CLOUD_REGIONS.length
