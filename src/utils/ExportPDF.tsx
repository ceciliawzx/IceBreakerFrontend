import jsPDF from "jspdf";
import { UserProfile } from "../type/UserProfile";
import exp from "constants";

const exportUserProfileAsPDF = (userProfile: UserProfile) => {
  console.log("exporting user profile as PDF: ", userProfile.displayName);
  const doc = new jsPDF();

  const lineHeight = 10;
  let linePosition = 20;
  if (userProfile.profileImage) {
    doc.addImage(userProfile.profileImage, "JPEG", 10, linePosition, 50, 50); // Adjust dimensions as needed
    linePosition += 60; // Adjust based on the size of the image
  }
  doc.text(`Display Name: ${userProfile.displayName}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`First Name: ${userProfile.firstName}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`Last Name: ${userProfile.lastName}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`City: ${userProfile.city}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`Country: ${userProfile.country}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`Feeling: ${userProfile.feeling}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`Favorite Food: ${userProfile.favFood}`, 10, linePosition);
  linePosition += lineHeight;
  doc.text(`Favorite Activity: ${userProfile.favActivity}`, 10, linePosition);

  doc.save(`${userProfile.displayName} export.pdf`);
};

export default exportUserProfileAsPDF;
