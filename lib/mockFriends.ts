export interface Friend {
  id: number;
  name: string;
  username: string;
  currency: string;
  avatar?: string;
  initials: string;
  color: string;
}

export const friends: Friend[] = [
  {
    id: 1,
    name: "Alessandro",
    username: "@alerex",
    currency: "EUR",
    initials: "A",
    color: "#6B7280",
  },
  {
    id: 2,
    name: "Nik",
    username: "@nik",
    currency: "EUR",
    initials: "N",
    color: "#8B5CF6",
  },
  {
    id: 3,
    name: "Maxi",
    username: "@maxieth",
    currency: "EUR",
    initials: "M",
    color: "#D97706",
  },
];
