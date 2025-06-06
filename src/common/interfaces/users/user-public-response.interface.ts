import { IGender, ILocation } from "./user.interface";

export interface UserPublicResponse {
  id: string;
  name: string;
  lastName: string;
  photo: string;
  email?: string;
  prefix?: string;
  phoneNumber?: string;
  address?: string;
  gender?: IGender;
  location?: ILocation;
}