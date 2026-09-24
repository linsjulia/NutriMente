interface Prop{
    number: string;
    title: string;
    active: boolean;
}


export default function RegisterIconNumbers({number, title, active}: Prop) {
  return (
    <div className="flex flex-col gap-20">
        <div className="flex flex-row gap-4 text-blue2 items-center">
            <div className={`border-2 rounded-full w-8 h-8 p-7 text-[26px] font-bold font-fraunces text-center flex justify-center items-center transition-colors duration-200 ${
                active
                    ? "bg-blue1 border-blue1 text-white "
                    : "border-blue1 text-blue1"
            }`}>
                <p>{number}</p>
            </div>

            <h2 className="text-[18px] font-bold">{title}</h2>
        </div>
    </div>
  );
}
