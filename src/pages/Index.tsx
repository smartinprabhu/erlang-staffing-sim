import { ContactCenterApp } from "@/components/ContactCenterApp";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="flex justify-end pt-4 pb-2">
          <ThemeToggle />
        </div>
        <ContactCenterApp />
      </div>
    </div>
  );
};

export default Index;
