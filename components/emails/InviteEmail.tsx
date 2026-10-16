import React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from "@react-email/components";

interface InviteEmailProps {
  planName: string;
  inviterName: string;
  joinUrl: string;
}

export function InviteEmail({
  planName = "an upcoming trip",
  inviterName = "A friend",
  joinUrl = "https://example.com",
}: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${inviterName} invited you to collaborate on ${planName}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={logo}>PATHFINDER AI</Text>
            <Text style={subLogo}>Editorial Travel Planning</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>You&apos;re Invited on a Journey</Heading>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> has invited you to collaborate on the travel itinerary for:
            </Text>

            <Section style={destinationCard}>
              <Text style={destinationText}>{planName}</Text>
            </Section>

            <Text style={paragraph}>
              As a collaborator, you can view the daily schedule, add and edit activities, recommend local delicacies, and track shared expenses with the group.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={joinUrl}>
                Accept Invitation & View Trip
              </Button>
            </Section>

            <Text style={smallText}>
              Or copy and paste this link into your browser:
              <br />
              <a href={joinUrl} style={link}>
                {joinUrl}
              </a>
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Pathfinder AI • Intelligent, collaborative travel experiences.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#fdfbf7",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #ebd9c8",
  borderRadius: "16px",
  maxWidth: "560px",
  margin: "0 auto",
  overflow: "hidden" as const,
};

const headerSection = {
  backgroundColor: "#c85a32",
  padding: "28px 24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold" as const,
  letterSpacing: "3px",
  margin: "0",
};

const subLogo = {
  color: "#fbebe4",
  fontSize: "12px",
  margin: "4px 0 0 0",
  letterSpacing: "1px",
};

const contentSection = {
  padding: "32px 32px 24px 32px",
};

const heading = {
  color: "#2d241e",
  fontSize: "22px",
  fontWeight: "bold" as const,
  margin: "0 0 16px 0",
};

const paragraph = {
  color: "#5c4f43",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const destinationCard = {
  backgroundColor: "#faf5ef",
  border: "1px solid #ebd9c8",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0",
};

const destinationText = {
  color: "#c85a32",
  fontSize: "18px",
  fontWeight: "bold" as const,
  margin: "0",
  textAlign: "center" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#c85a32",
  borderRadius: "30px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "14px 28px",
  display: "inline-block",
};

const smallText = {
  color: "#8c7e72",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "24px 0 0 0",
};

const link = {
  color: "#c85a32",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#f0e6dc",
  margin: "0",
};

const footer = {
  padding: "20px 32px",
  backgroundColor: "#faf5ef",
  textAlign: "center" as const,
};

const footerText = {
  color: "#8c7e72",
  fontSize: "12px",
  margin: "0",
};
