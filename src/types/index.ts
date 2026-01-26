// TODO: TypeScript type definitions
export interface Project {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    municipality: string;
  };
  fundingGoal: number;
  fundingRaised: number;
  status: 'active' | 'funded' | 'completed';
}

export interface Inquiry {
  id: string;
  projectId: string;
  donorEmail: string;
  message: string;
  createdAt: Date;
}
