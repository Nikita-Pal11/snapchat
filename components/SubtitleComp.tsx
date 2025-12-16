'use client'
type snapcomp={
    colorClass:string,
    text:string,
    onOpen:()=>void
}
function SubtitleComp({text,colorClass,onOpen}:snapcomp) {
  return (
    <button onClick={(e)=>{e.stopPropagation();
        onOpen()
    }}  className="
        flex items-center gap-2
        text-left
        focus:outline-none
        active:scale-95
      ">
          <span className="h-3 w-3 rounded-md bg-red-600 shrink-0" />

      {/* Text */}
      <span className={`${colorClass} text-sm`}>
        {text}
      </span>
    
      
    </button>
  )
}

export default SubtitleComp
