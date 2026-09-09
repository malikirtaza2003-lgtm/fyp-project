import { getCachedUsers } from './api';

// Team Lead Assignment System
// This now prefers persisted backend data and falls back to the legacy seed map.

export const teamAssignments = [
  {
    teamLeadId: "TL-001",
    teamLeadName: "Sarah Chen",
    teamMembers: ["John Doe", "Mike Johnson", "Tom Brown"],
    department: "Engineering",
  },
  {
    teamLeadId: "TL-002",
    teamLeadName: "Team Lead 2",
    teamMembers: ["Jane Smith"],
    department: "Design",
  },
  {
    teamLeadId: "TL-003",
    teamLeadName: "Team Lead 3",
    teamMembers: ["Sarah Wilson", "Lisa Anderson"],
    department: "Marketing",
  },
];

// Get team members for a specific Team Lead
export function getTeamMembers(teamLeadName) {
  const cachedUsers = getCachedUsers();

  if (cachedUsers.length > 0) {
    const lead = cachedUsers.find((user) => user.name === teamLeadName && user.role === 'teamlead');

    if (lead?.department) {
      return cachedUsers
        .filter((user) => user.role === 'employee' && user.department === lead.department)
        .map((user) => user.name);
    }
  }

  const assignment = teamAssignments.find(t => t.teamLeadName === teamLeadName);
  return assignment?.teamMembers ?? [];
}

// Check if an employee belongs to a Team Lead's team
export function isTeamMember(teamLeadName, employeeName) {
  const members = getTeamMembers(teamLeadName);
  return members.includes(employeeName);
}

// Get Team Lead's department
export function getTeamLeadDepartment(teamLeadName) {
  const cachedUsers = getCachedUsers();
  const lead = cachedUsers.find((user) => user.name === teamLeadName && user.role === 'teamlead');

  if (lead?.department) {
    return lead.department;
  }

  const assignment = teamAssignments.find(t => t.teamLeadName === teamLeadName);
  return assignment?.department ?? "";
}

// Filter data based on Team Lead's team
export function filterByTeam(
  data,
  teamLeadName,
  userRole
) {
  if (userRole === "admin") return data;

  const teamMembers = getTeamMembers(teamLeadName);
  return data.filter(item => {
    // Check various fields that might contain employee names
    if (item.employee && teamMembers.includes(item.employee)) return true;
    if (item.assignedTo && teamMembers.includes(item.assignedTo)) return true;
    if (item.createdBy && teamMembers.includes(item.createdBy)) return true;
    return false;
  });
}
