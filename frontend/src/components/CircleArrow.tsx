interface CircleArrowProps {
  colorFill?: boolean;
}
function CircleArrow(props: CircleArrowProps) {
  return (
    <div
      className={`flex justify-center items-center h-10 w-10 border  ${props.colorFill ? "border-white bg-white text-primary" : "text-black border-black"}  rounded-full rotate-315`}
    >
      <svg
        fill={"currentColor"}
        version="1.1"
        id="Capa_1"
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 268.832 268.832"
      >
        <g>
          <path
            d="M265.171,125.577l-80-80c-4.881-4.881-12.797-4.881-17.678,0c-4.882,4.882-4.882,12.796,0,17.678l58.661,58.661H12.5
		c-6.903,0-12.5,5.597-12.5,12.5c0,6.902,5.597,12.5,12.5,12.5h213.654l-58.659,58.661c-4.882,4.882-4.882,12.796,0,17.678
		c2.44,2.439,5.64,3.661,8.839,3.661s6.398-1.222,8.839-3.661l79.998-80C270.053,138.373,270.053,130.459,265.171,125.577z"
          />
        </g>
      </svg>
    </div>
  );
}

export default CircleArrow;
