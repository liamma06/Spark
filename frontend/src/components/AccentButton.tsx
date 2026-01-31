interface AccentButtonProps {
  children?: React.ReactNode;
  isGreen?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
}

function AccentButton(props: AccentButtonProps) {
  const onClick = () => {
    if (props.onClick) {
      props.onClick();
    }
  };
  return (
    <button
      onClick={onClick}
      className={`pl-4 pr-6 py-3 rounded-full ${props.isGreen ? "bg-linear-to-b from-green-gradient-dark to-green-gradient-light text-white" : "border border-primary text-primary"} flex items-center gap-2 cursor-pointer`}
    >
      {props.icon}
      <span
        className={`${props.isGreen ? "text-white" : "text-primary"} text-sm`}
      >
        {props.children}
      </span>
    </button>
  );
}

export default AccentButton;
