with open('ava.pbtxt', "r") as infile:
    instring = infile.read()
    mid1 = instring.split("item")
    with open('ava.json', "w") as outfile:
        outfile.write("{")
        print("[")
        for item in mid1:
            index = item.find("name:")
            index2 = item.find("id:")
            index3 = item.find(" }")
            key = item[index+6:index2-1]
            val = item[index2+4:index3]
            if val!="":
                print(val, end=", ")
                if int(val)!=80:
                    outfile.write(key+":"+str(int(val)-1)+",")
                else:
                    outfile.write(key + ":" + str(int(val) - 1))
        print("]")
        outfile.write("}")
