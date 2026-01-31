import { useAppStore } from "../stores/appStore";

export function RoleToggle() {
  const { role, setRole } = useAppStore();

  const otherRole = () => {
    return role == "patient" ? "Provider" : "Patient";
  };
  return (
    <div className="flex flex-col w-full items-start mb-6 ml-1">
      <a
        className="text-sm text-primary cursor-pointer hover:underline pt-2"
        onClick={() => {
          setRole(role == "patient" ? "provider" : "patient");
        }}
      >
        I'm a {otherRole()}?
      </a>
    </div>
  );
}
