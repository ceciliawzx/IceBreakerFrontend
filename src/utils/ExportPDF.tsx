import jsPDF from "jspdf";
import { UserProfile } from "../type/UserProfile";
import exp from "constants";
import backgroundImage from "../assets/PDFBackground.png";

export const exportUserProfileAsPDF = (userProfile: UserProfile) => {
  console.log("exporting user profile as PDF: ", userProfile.displayName);
  const doc = new jsPDF();

  addPDFInfo(doc, userProfile);

  doc.save(`${userProfile.displayName} export.pdf`);
};

// Function to calculate the centered x-coordinate
const getCenteredX = (doc: any, text: string) => {
  return (doc.internal.pageSize.width - doc.getTextWidth(text)) / 2;
};

const printCenteredText = (doc: any, text: string, yPos: number) => {
  doc.text(text, getCenteredX(doc, text), yPos);
};

export const addPDFInfo = (doc: any, userProfile: UserProfile) => {
  // Add background image
  doc.addImage(
    backgroundImage,
    "PNG",
    0,
    0,
    doc.internal.pageSize.width,
    doc.internal.pageSize.height
  );

  let linePosition = 50;
  const textHeight = 15;

  if (userProfile.profileImage) {
    const imageWidth = 50;
    const imageHeight = 50;
    const imageX = 30;
    const imageY = linePosition;
    doc.addImage(
      userProfile.profileImage,
      "JPEG",
      imageX,
      imageY,
      imageWidth,
      imageHeight
    );
    linePosition += 65; // Adjust based on the size of the image
  }

  // Name
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");

  printCenteredText(
    doc,
    `${userProfile.firstName} ${userProfile.lastName}`,
    linePosition
  );

  linePosition += textHeight;

  // Info
  doc.setFontSize(20);
  doc.setFont("helvetica", "normal");
  printCenteredText(
    doc,
    `Display Name: ${userProfile.displayName}`,
    linePosition
  );

  linePosition += textHeight;
  printCenteredText(doc, `City: ${userProfile.city}`, linePosition);
  linePosition += textHeight;
  printCenteredText(doc, `Country: ${userProfile.country}`, linePosition);
  linePosition += textHeight;
  printCenteredText(doc, `Feeling: ${userProfile.feeling}`, linePosition);
  linePosition += textHeight;
  printCenteredText(doc, `Favorite Food: ${userProfile.favFood}`, linePosition);
  linePosition += textHeight;
  printCenteredText(
    doc,
    `Favorite Activity: ${userProfile.favActivity}`,
    linePosition
  );
};

export default exportUserProfileAsPDF;
