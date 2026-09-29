
interface Prop{
    categoria: string;
}


export default function CategoryBadge({categoria} : Prop){
    return(
        <>
        <div className=" w-fit rounded-full px-3 py-2 text-[13px] bg-[#ACFFCE] text-[#3B8F7E]">
            <h2>{categoria}</h2>
        </div>
        </>
    )
}