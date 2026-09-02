interface Prop{
    number: string;
    title: string;
}


export default function RegisterIconNumbers({number, title}: Prop) {
  return (
    <div className="flex flex-col gap-20">
        <div className="flex flex-row gap-4 text-white font-bold items-center">
            <div className="border-2 border-white rounded-full w-5 h-5 p-5 text-center flex justify-center items-center text-white font-bold">
                <p>{number}</p>
            </div>

            <h2>{title}</h2>
        </div>
    </div>
  );
}
