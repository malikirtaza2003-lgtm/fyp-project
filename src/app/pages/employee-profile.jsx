import { useEffect, useRef, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit, Camera, Save, X } from "lucide-react";
import { showToast } from "../utils/toast";
import { fetchCurrentUser, request } from "../utils/api";
import { getAuthToken, getCurrentUser, setAuthSession } from "../utils/auth";

function mapUserToProfile(user) {
  const deptVal = user?.department;
  const deptStr = typeof deptVal === "object" ? (deptVal.name ?? "Engineering") : (deptVal || "Engineering");
  const nameVal = user?.name;
  const nameStr = typeof nameVal === "object" ? (nameVal.name ?? "John Doe") : (nameVal || "John Doe");

  return {
    name: nameStr,
    email: user?.email ?? "john.doe@company.com",
    phone: user?.phone ?? user?.contact ?? "+1 234 567 8900",
    department: deptStr,
    designation: user?.jobTitle ?? user?.role ?? "Frontend Developer",
    employeeId: user?.employeeId ?? "EMP-2024-001",
    joinDate: user?.joiningDate ?? "2024-01-15",
    address: user?.address ?? "123 Main Street, New York, NY 10001",
    emergencyContact: user?.emergencyContact ?? "+1 234 567 8999",
    cnic: user?.cnic ?? "12345-6789012-3",
  };
}

export default function EmployeeProfile() {
  const fileRef = useRef(null);

  const initialUser = getCurrentUser();
  const [profile, setProfile] = useState(mapUserToProfile(initialUser));
  const [profilePic, setProfilePic] = useState(initialUser?.profilePicture ?? initialUser?.avatarUrl ?? "");

  const [isEditing, setIsEditing]         = useState(false);
  const [draftProfile, setDraftProfile]   = useState(null);
  const [draftPic, setDraftPic]           = useState(null);

  const displayedPic = isEditing && draftPic !== null ? draftPic : profilePic;

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetchCurrentUser();
        if (!mounted) {
          return;
        }

        setProfile(mapUserToProfile(response.user));
        setProfilePic(response.user?.profilePicture ?? response.user?.avatarUrl ?? "");
      } catch {
        if (mounted && initialUser) {
          setProfile(mapUserToProfile(initialUser));
          setProfilePic(initialUser?.profilePicture ?? initialUser?.avatarUrl ?? "");
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleEnterEdit = () => {
    setDraftProfile({ ...profile });
    setDraftPic(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (draftProfile) {
      try {
        const response = await request("/users/me", {
          method: "PATCH",
          body: {
            name: draftProfile.name,
            email: draftProfile.email,
            phone: draftProfile.phone,
            department: draftProfile.department,
            jobTitle: draftProfile.designation,
            employeeId: draftProfile.employeeId,
            joiningDate: draftProfile.joinDate,
            address: draftProfile.address,
            emergencyContact: draftProfile.emergencyContact,
            cnic: draftProfile.cnic,
            profilePicture: draftPic ?? profilePic,
            avatarUrl: draftPic ?? profilePic,
          },
        });

        setProfile(mapUserToProfile(response.user));
        setProfilePic(response.user?.profilePicture ?? response.user?.avatarUrl ?? draftPic ?? profilePic);
        setAuthSession({ token: getAuthToken(), user: response.user });
      } catch (error) {
        showToast(error.message || "Unable to update profile", "error");
        return;
      }
    }
    if (draftPic !== null) {
      setProfilePic(draftPic);
    }
    setDraftProfile(null);
    setDraftPic(null);
    setIsEditing(false);
    showToast("Profile updated successfully", "success");
  };

  const handleCancel = () => {
    setDraftProfile(null);
    setDraftPic(null);
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setDraftPic(ev.target?.result);
      showToast("Photo selected — click Save Changes to apply", "info");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const val = (field) =>
    isEditing && draftProfile ? draftProfile[field] : profile[field];

  const set = (field, value) => {
    if (draftProfile) {
      setDraftProfile(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <AppLayout userRole="employee">
      <div className="space-y-6 max-w-4xl">

        <div className="flex justify-between items-center">
          <div>
            <h1>My Profile</h1>
            <p className="text-muted-foreground">
              {isEditing ? "Edit your personal information below. Click Save when done." : "View your personal information"}
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={handleEnterEdit} className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="rounded-xl border-gray-200 gap-2">
                <X className="h-4 w-4" />Cancel
              </Button>
              <Button onClick={handleSave} className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2">
                <Save className="h-4 w-4" />Save Changes
              </Button>
            </div>
          )}
        </div>

        <Card className={isEditing ? "border-2 border-[#162E93]/20" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 mb-2">
              <div className="relative flex-shrink-0">
                <div
                  className={`relative ${isEditing ? "group cursor-pointer" : ""}`}
                  onClick={() => isEditing && fileRef.current?.click()}
                  title={isEditing ? "Click to change profile picture" : undefined}
                >
                  <Avatar className="h-24 w-24">
                    {displayedPic && <AvatarImage src={displayedPic} alt={profile.name} className="object-cover" />}
                    <AvatarFallback className="bg-[#162E93] text-white text-2xl">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>

                {isEditing && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-[#162E93] rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#1a36a8] transition-colors"
                    title="Upload photo"
                  >
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <h2>{profile.name}</h2>
                <p className="text-muted-foreground">{profile.designation}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-[#162E93] text-white">{typeof profile.department === "object" ? (profile.department.name ?? "—") : (profile.department || "—")}</Badge>
                  <Badge variant="outline">{profile.employeeId}</Badge>
                </div>
                {isEditing && (
                  <p className="mt-2 text-xs text-[#088395]">
                    {draftPic !== null ? "📸 New photo selected — click Save Changes to apply" : "Click photo to change"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isEditing ? "border-2 border-[#162E93]/20" : ""}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={val("name")}
                      onChange={e => set("name", e.target.value)}
                      className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
                    />
                  ) : (
                    <span className="text-sm">{profile.name}</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Email Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      type="email"
                      value={val("email")}
                      onChange={e => set("email", e.target.value)}
                      className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
                    />
                  ) : (
                    <span className="text-sm">{profile.email}</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Phone Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={val("phone")}
                      onChange={e => set("phone", e.target.value)}
                      className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
                    />
                  ) : (
                    <span className="text-sm">{profile.phone}</span>
                  )}
                </div>
              </div>

              <div>
                <Label>CNIC</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={val("cnic")}
                      onChange={e => set("cnic", e.target.value)}
                      className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
                    />
                  ) : (
                    <span className="text-sm">{profile.cnic}</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Address</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {isEditing ? (
                    <Input
                      value={val("address")}
                      onChange={e => set("address", e.target.value)}
                      className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
                    />
                  ) : (
                    <span className="text-sm">{profile.address}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>Employee ID</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.employeeId}</span>
                </div>
              </div>
              <div>
                <Label>Department</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{typeof profile.department === "object" ? (profile.department.name ?? "—") : (profile.department || "—")}</span>
                </div>
              </div>
              <div>
                <Label>Designation</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.designation}</span>
                </div>
              </div>
              <div>
                <Label>Join Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(profile.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isEditing ? "border-2 border-[#162E93]/20" : ""}>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Emergency Contact Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {isEditing ? (
                  <Input
                    value={val("emergencyContact")}
                    onChange={e => set("emergencyContact", e.target.value)}
                    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
                  />
                ) : (
                  <span className="text-sm">{profile.emergencyContact}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-3 pb-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1 rounded-xl border-gray-200 gap-2">
              <X className="h-4 w-4" />Discard Changes
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2">
              <Save className="h-4 w-4" />Save Changes
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
