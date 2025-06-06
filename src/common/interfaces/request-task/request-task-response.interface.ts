export interface TaskRequestResponse {
	id: string;
	title: string;
	description: string;
	status: string;
	address: string;
	images: string[];
	client: Client;
	reasonOfCancelation?: string;
	location: Location;
}

interface Client {
  id: string;
  email: string;
  name: string;
  photo: string;
}

interface Location {
  latitude: number;
  longitude: number;
}